import * as XLSX from 'xlsx';

export interface ExcelVariable {
  name: string;
  value: string | number | boolean;
}

/**
 * Process Excel template by replacing variables in cells
 */
export function processExcelTemplate(
  fileData: string, // base64 encoded Excel file
  variables: Record<string, string | number | boolean>
): Blob {
  try {
    console.log('Processing Excel template with variables:', variables);
    
    // Convert base64 to binary
    const binaryString = atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Read the Excel file
    const workbook = XLSX.read(bytes, { type: 'array' });

    // Process each worksheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Get the range of cells in the worksheet
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      
      // Process each cell in the range
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          
          if (cell && cell.t === 's' && typeof cell.v === 'string') {
            // Replace variables in cell value
            const processedValue = replaceVariablesInString(cell.v, variables);
            if (processedValue !== cell.v) {
              console.log(`Replacing cell ${cellAddress}: "${cell.v}" -> "${processedValue}"`);
              cell.v = processedValue;
            }
          }
        }
      }
    });

    // Convert back to blob
    const processedBytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    return new Blob([processedBytes], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  } catch (error) {
    console.error('Error processing Excel template:', error);
    throw new Error('Failed to process Excel template');
  }
}

/**
 * Replace variables in a string using {{variableName}} syntax
 */
function replaceVariablesInString(
  text: string, 
  variables: Record<string, string | number | boolean>
): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const trimmedName = variableName.trim();
    const value = variables[trimmedName];
    
    console.log(`Looking for variable "${trimmedName}" in variables:`, Object.keys(variables));
    console.log(`Value found:`, value);
    
    if (value !== undefined && value !== null) {
      return String(value);
    }
    
    // If variable not found, return the original placeholder
    return match;
  });
}

/**
 * Extract variables from Excel template
 */
export function extractExcelVariables(fileData: string): string[] {
  try {
    // Convert base64 to binary
    const binaryString = atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Read the Excel file
    const workbook = XLSX.read(bytes, { type: 'array' });
    const variables = new Set<string>();

    // Process each worksheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Get the range of cells in the worksheet
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      
      // Process each cell in the range
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          
          if (cell && cell.t === 's' && typeof cell.v === 'string') {
            // Extract variables from cell value
            const cellVariables = extractVariablesFromString(cell.v);
            cellVariables.forEach(variable => variables.add(variable));
          }
        }
      }
    });

    return Array.from(variables);
  } catch (error) {
    console.error('Error extracting Excel variables:', error);
    return [];
  }
}

/**
 * Extract variables from string using regex
 */
function extractVariablesFromString(text: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(text)) !== null) {
    variables.push(match[1].trim());
  }

  return variables;
} 