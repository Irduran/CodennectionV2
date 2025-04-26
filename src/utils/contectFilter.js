const bannedWords = [
    "maldicion1", "maldicion2", "palabrota", "racista1", "ofensivo1"
    // Agrega aquí todas las palabras ofensivas que desees filtrar
  ];
  
  export function containsInappropriateContent(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return bannedWords.some(word => lowerText.includes(word));
  }
  