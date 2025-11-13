import { NextResponse } from 'next/server';

// Conditional imports for non-Vercel environments only
let fs: any, path: any, crypto: any, PDFLoader: any, DocxLoader: any, RecursiveCharacterTextSplitter: any, Document: any, ModelRegistry: any;

if (!process.env.VERCEL) {
  try {
    fs = require('fs');
    path = require('path');
    crypto = require('crypto');
    ({ PDFLoader } = require('@langchain/community/document_loaders/fs/pdf'));
    ({ DocxLoader } = require('@langchain/community/document_loaders/fs/docx'));
    ({ RecursiveCharacterTextSplitter } = require('@langchain/textsplitters'));
    ({ Document } = require('@langchain/core/documents'));
    ModelRegistry = require('@/lib/models/registry').default;
  } catch (error) {
    console.warn('Document processing dependencies not available');
  }
}

interface FileRes {
  fileName: string;
  fileExtension: string;
  fileId: string;
}

const uploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 100,
});

export async function POST(req: Request) {
  // Disable file uploads on Vercel - use cloud document processing instead
  if (process.env.VERCEL) {
    return NextResponse.json(
      { 
        message: 'File uploads are not available on Vercel deployment. Please use URL-based document processing or upgrade to a platform with file storage capabilities.' 
      },
      { status: 501 }
    );
  }
  
  try {
    const formData = await req.formData();

    const files = formData.getAll('files') as File[];
    const embedding_model = formData.get('embedding_model_key') as string;
    const embedding_model_provider = formData.get('embedding_model_provider_id') as string;

    if (!embedding_model || !embedding_model_provider) {
      return NextResponse.json(
        { message: 'Missing embedding model or provider' },
        { status: 400 },
      );
    }

    const registry = new ModelRegistry();

    const model = await registry.loadEmbeddingModel(embedding_model_provider, embedding_model);

    const processedFiles: FileRes[] = [];

    await Promise.all(
      files.map(async (file: any) => {
        const fileExtension = file.name.split('.').pop();
        if (!['pdf', 'docx', 'txt'].includes(fileExtension!)) {
          return NextResponse.json(
            { message: 'File type not supported' },
            { status: 400 },
          );
        }

        const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
        const filePath = path.join(uploadDir, uniqueFileName);

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, new Uint8Array(buffer));

        let docs: any[] = [];
        if (fileExtension === 'pdf') {
          const loader = new PDFLoader(filePath);
          docs = await loader.load();
        } else if (fileExtension === 'docx') {
          const loader = new DocxLoader(filePath);
          docs = await loader.load();
        } else if (fileExtension === 'txt') {
          const text = fs.readFileSync(filePath, 'utf-8');
          docs = [
            new Document({ pageContent: text, metadata: { title: file.name } }),
          ];
        }

        const splitted = await splitter.splitDocuments(docs);

        const extractedDataPath = filePath.replace(/\.\w+$/, '-extracted.json');
        fs.writeFileSync(
          extractedDataPath,
          JSON.stringify({
            title: file.name,
            contents: splitted.map((doc) => doc.pageContent),
          }),
        );

        const embeddings = await model.embedDocuments(
          splitted.map((doc) => doc.pageContent),
        );
        const embeddingsDataPath = filePath.replace(
          /\.\w+$/,
          '-embeddings.json',
        );
        fs.writeFileSync(
          embeddingsDataPath,
          JSON.stringify({
            title: file.name,
            embeddings,
          }),
        );

        processedFiles.push({
          fileName: file.name,
          fileExtension: fileExtension,
          fileId: uniqueFileName.replace(/\.\w+$/, ''),
        });
      }),
    );

    return NextResponse.json({
      files: processedFiles,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}
