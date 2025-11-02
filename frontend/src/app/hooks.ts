import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store'; // store.ts'den tipleri al

// Standart hook'lar yerine uygulamanızda bu tipli hook'ları kullanın
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <TSelected = unknown>(
  selector: (state: RootState) => TSelected
): TSelected => useSelector(selector);