import { useEffect } from 'react';
import feather from 'feather-icons';

export function useFeather() {
  useEffect(() => {
    feather.replace();
  });
}

export function replaceFeather() {
  feather.replace();
}

export default useFeather;