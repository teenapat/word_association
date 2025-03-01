import { AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const wordCache = new Map<string, boolean>(); // ✅ Caching word checks

function App() {
  const [words, setWords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const isNoun = async (word: string): Promise<boolean> => {
    if (wordCache.has(word)) {
      return wordCache.get(word)!;
    }

    try {
      const isEnglish = /^[A-Za-z]+$/.test(word);
      let isNoun = false;

      if (isEnglish) {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (response.ok) {
          const data = await response.json();
          isNoun = data.some((entry: any) =>
            entry.meanings.some((meaning: any) =>
              meaning.partOfSpeech === "noun"
            )
          );
        }
      } else {
        const response = await fetch(`https://isnoun-production.up.railway.app/is_noun/${word}`);
        if (response.ok) {
          const data = await response.json();
          isNoun = data.is_noun;
        }
      }

      wordCache.set(word, isNoun);
      return isNoun;
    } catch (error) {
      return false;
    }
  };

  const isSimilarWord = (newWord: string, existingWords: string[]): string | null => {
    for (let word of existingWords) {
      if (newWord.includes(word) || word.includes(newWord)) {
        return word;
      }
    }
    return null;
  };

  const isTranslation = async (newWord: string, prevWord: string): Promise<boolean> => {
    try {
      const [translationResponse] = await Promise.all([
        fetch(`https://api.mymemory.translated.net/get?q=${prevWord}&langpair=th|en`)
      ]);

      if (!translationResponse.ok) return false;

      const translationData = await translationResponse.json();
      const translatedText = translationData.responseData.translatedText.toLowerCase();

      return newWord.toLowerCase() === translatedText;
    } catch (error) {
      return false;
    }
  };

  const validateWord = async (word: string): Promise<boolean> => {
    if (!word.trim()) {
      setError("กรุณาใส่คำ");
      return false;
    }

    if (words.includes(word)) {
      setError(`ซ้ำกับคำว่า "${word}"`);
      return false;
    }

    const similarWord = isSimilarWord(word, words);
    if (similarWord) {
      setError(`ซ้ำกับคำว่า "${similarWord}"`);
      return false;
    }

    const [isNounCheck, isTranslationCheck] = await Promise.all([
      isNoun(word),
      words.length > 0 ? isTranslation(word, words[words.length - 1]) : Promise.resolve(false)
    ]);

    if (!isNounCheck) {
      setError("ไม่ใช่คำนาม");
      return false;
    }

    if (isTranslationCheck) {
      setError(`ห้ามแปลจากคำว่า "${words[words.length - 1]}"`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    if (await validateWord(trimmedValue)) {
      setWords([...words, trimmedValue]);
      setInputValue("");
      setError(null);
    }
  };

  const handleReset = () => {
    setWords([]);
    setInputValue("");
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleDelete = (index: number) => {
    setWords(words.filter((_, i) => i !== index));
  };

  const colors = [
    "text-red-500", "text-blue-400", "text-blue-700", "text-yellow-500",
    "text-blue-400", "text-red-500", "text-blue-400", "text-blue-700"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center px-4 py-12 font-kanit">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-2">
          {"คำต้องเชื่อม".split('').map((char, index) => (
            <span key={index} className={colors[index % colors.length]}>
              {char}
            </span>
          ))}
        </h1>
        <p className="text-gray-600 text-center mb-8">ยกกำลัง</p>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">เพิ่มคำใหม่</h2>
            <button 
              onClick={handleReset}
              className="flex items-center text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              <RefreshCw size={16} className="mr-1" />
              รีเซ็ต
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="พิมพ์คำที่นี่..."
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 transition-colors"
              >
                ส่ง
              </button>
            </div>
            
            {error && (
              <div className="flex items-center mt-2 text-red-500">
                <AlertCircle size={16} className="mr-1" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </form>
        </div>

        {words.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">คำทั้งหมด</h2>
            <ul>
              {words.map((word, index) => (
                <li key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-lg mb-2">
                  <span>{word}</span>
                  <button onClick={() => handleDelete(index)}>
                    <Trash2 size={16} className="text-red-500 hover:text-red-700" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;