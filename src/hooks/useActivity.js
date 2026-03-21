import { useContext } from 'react';
import ActivityContext from '../context/ActivityContextObject';

export const useActivity = () => useContext(ActivityContext);
