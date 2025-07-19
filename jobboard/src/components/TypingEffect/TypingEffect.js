import React, { useEffect, useState, useRef } from 'react';
import './TypingEffect.css';

const TypingEffect = () => {
  const words = ['New Grads', 'Mid-Level', 'Early-Career'];

  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [speed, setSpeed] = useState(100);

  const charIndexRef = useRef(0);

  useEffect(() => {
    const handleTyping = () => {
      const currentWord = words[currentWordIndex];

      if (isDeleting) {
        charIndexRef.current -= 1;
        setText(currentWord.substring(0, charIndexRef.current));
      } else {
        charIndexRef.current += 1;
        setText(currentWord.substring(0, charIndexRef.current));
      }

      if (!isDeleting && charIndexRef.current === currentWord.length) {
        setIsDeleting(true);
        setSpeed(1000); // pause before deleting
      } else if (isDeleting && charIndexRef.current === 0) {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setSpeed(200); // pause before typing next word
      } else {
        setSpeed(isDeleting ? 50 : 100);
      }
    };

    const timer = setTimeout(handleTyping, speed);

    return () => clearTimeout(timer);
  }, [text, isDeleting, currentWordIndex, speed, words]);

  return (
    <span className="typed-highlight">
      {text || '\u00A0'}
      <span className="cursor">|</span>
    </span>
  );
};

export default TypingEffect;
