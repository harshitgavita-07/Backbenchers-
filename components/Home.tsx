import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Library } from 'lucide-react';

interface HomeProps {
  onInitiate: (topic: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onInitiate }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onInitiate(topic.trim());
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center w-full max-w-xl"
      >
        <div className="mb-8 flex flex-col items-center opacity-80 text-accent">
          <Library size={48} strokeWidth={1.5} />
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-bold text-parchment mb-4 tracking-tight leading-none uppercase">
          Backbenchers
        </h1>
        <p className="text-parchment/60 text-lg font-serif italic mb-16 tracking-wide">
          Core Learning Engine
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center space-y-12">
          <div className="relative w-full group">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="ENTER TOPIC..."
              className="w-full bg-transparent border-b border-parchment/20 py-4 text-center text-2xl text-parchment font-display placeholder-parchment/20 focus:outline-none focus:border-accent transition-colors duration-300 uppercase tracking-wider"
              autoFocus
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!topic.trim()}
            type="submit"
            className={`
              px-10 py-4 border border-parchment/40 text-parchment font-display font-bold tracking-[0.2em] text-sm uppercase
              hover:bg-parchment hover:text-darkBg transition-all duration-300
              disabled:opacity-30 disabled:cursor-not-allowed
            `}
          >
            Initiate Cycle
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};