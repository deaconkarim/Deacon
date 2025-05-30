import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

export const generateBulletin = async (data) => {
  try {
    // Fetch the template file
    const response = await fetch('/Bulletin_Template.docx');
    const blob = await response.blob();
    
    // Read the template file
    const arrayBuffer = await blob.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    
    // Create a new instance of Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Set the template data
    doc.setData(data);
    
    // Render the document
    doc.render();
    
    // Get the generated document
    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    
    // Save the document with the bulletin date
    saveAs(out, `Bulletin_${data.date}.docx`);
    
    return true;
  } catch (error) {
    console.error('Error generating bulletin:', error);
    throw error;
  }
}; 