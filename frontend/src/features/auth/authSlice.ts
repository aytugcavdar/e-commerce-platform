import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState as AppRootState } from '../../app/store';
import { User, AuthState } from '../../types';

const initialState: AuthState = { user: null, token: null };

const slice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: User, token: string }>) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
        },
        logOut: (state) => {
            state.user = null;
            state.token = null;
        }
    }
});

export const { setCredentials, logOut } = slice.actions;

export default slice.reducer;


export const selectCurrentUser = (state: AppRootState) => state.auth.user;