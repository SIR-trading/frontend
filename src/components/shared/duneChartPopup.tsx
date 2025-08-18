"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Move } from "lucide-react";

interface DuneChartPopupProps {
  embedUrl: string;
}

export default function DuneChartPopup({ embedUrl }: DuneChartPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const constraintsRef = useRef(null);

  const handleOpen = () => {
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <button
        className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-foreground/10 transition-colors text-base"
        title="View chart"
        onClick={handleOpen}
      >
        📊
      </button>
    );
  }

  return (
    <>
      {/* Invisible constraints container for drag bounds */}
      <div 
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-40"
      />
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Draggable popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            initial={{ 
              opacity: 0, 
              scale: 0.95,
              x: "-50%",
              y: "-50%"
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: "-50%",
              y: "-50%"
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95
            }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 w-[90vw] max-w-[600px] rounded-lg border border-foreground/20 bg-background shadow-2xl overflow-hidden"
            style={{
              top: '50%',
              left: '50%',
            }}
          >
            {/* Drag handle bar */}
            <div className="flex items-center justify-between bg-foreground/5 px-3 py-2 cursor-move">
              <div className="flex items-center gap-2 text-foreground/60">
                <Move className="h-4 w-4" />
                <span className="text-xs">Drag to move</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-foreground/60 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chart iframe */}
            <iframe
              src={embedUrl}
              width="100%"
              frameBorder="0"
              className="w-full h-[60vh] max-h-[450px] min-h-[300px]"
              title="Dune Analytics Chart"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}