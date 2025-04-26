export const badWords = ["puta", "idiota", "estupido", "mierda", "tonto", "imbecil", "perra", "zorra", "fuck", "shit", "whore", "nigga", "dogshit"];

export const contienePalabrasProhibidas = (texto) => {
  const textoNormalizado = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return badWords.some((palabra) => textoNormalizado.includes(palabra));
};
