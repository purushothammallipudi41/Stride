import { useContext } from 'react';
import UIContext from '../context/UIContextObject';

export const useUI = () => useContext(UIContext);
