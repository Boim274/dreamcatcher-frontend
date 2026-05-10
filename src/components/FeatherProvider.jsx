import { useEffect } from 'react';
import feather from 'feather-icons';

export default function FeatherProvider({ children }) {
  useEffect(() => {
    feather.replace();
  });

  return children;
}