import { useContext } from 'react';
import { ServerContext } from '../context/ServerContextObject';

export const useServer = () => useContext(ServerContext);
