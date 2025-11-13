import path from 'path';
import fs from 'fs';

export const getFileDetails = (fileId: string) => {
  try {
    const fileLoc = path.join(
      process.cwd(),
      './uploads',
      fileId + '-extracted.json',
    );

    // Check if file exists before reading
    if (!fs.existsSync(fileLoc)) {
      console.warn(`File not found: ${fileLoc}`);
      return {
        name: `File ${fileId}`,
        fileId: fileId,
      };
    }

    const parsedFile = JSON.parse(fs.readFileSync(fileLoc, 'utf8'));

    return {
      name: parsedFile.title,
      fileId: fileId,
    };
  } catch (error) {
    console.warn(`Error reading file details for ${fileId}:`, error);
    return {
      name: `File ${fileId}`,
      fileId: fileId,
    };
  }
};
