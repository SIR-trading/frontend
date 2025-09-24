import React from "react";

interface StakeCardWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function StakeCardWrapper({ children, className = "" }: StakeCardWrapperProps) {
  return (
    <div className={`stake-card-wrapper ${className}`}>
      {children}
    </div>
  );
}