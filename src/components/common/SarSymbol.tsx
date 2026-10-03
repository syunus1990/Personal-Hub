import React from 'react';
import { SAR_UNICODE } from '../../utils/currencyFormatter';

interface SarSymbolProps {
  className?: string;
}

/**
 * Official Saudi Riyal Symbol Component (U+20C1: ⃁)
 * Renders the official Saudi Riyal glyph with clean typography and direction isolation.
 */
export const SarSymbol: React.FC<SarSymbolProps> = ({ className = '' }) => {
  return (
    <span
      className={`inline-block font-sans font-bold select-none rtl:ml-1 ltr:mr-1 ${className}`}
      dir="ltr"
      aria-label="SAR"
    >
      {SAR_UNICODE}
    </span>
  );
};
