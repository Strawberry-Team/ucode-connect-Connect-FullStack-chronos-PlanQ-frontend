import {createSlice, PayloadAction} from '@reduxjs/toolkit'

interface User {
    id: string
    firstName: string;
    lastName: string;
    email: string
    profilePictureUrl: string
    profilePictureName: string
    countryCode: string;
    createdAt: string;
    updatedAt: string;
}


interface UserState {
    currentUser: User | null
    loading: boolean
    error: string | null
}

const initialState: UserState = {
    currentUser: null,
    loading: false,
    error: null,
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        getUserRequest: (state) => {
            state.loading = true
            state.error = null
        },
        getUserSuccess: (state, action: PayloadAction<User>) => {
            state.currentUser = action.payload
            state.loading = false
        },
        getUserFailure: (state, action: PayloadAction<string>) => {
            state.loading = false
            state.error = action.payload
        },
        updateUserRequest: (state) => {
            state.loading = true
            state.error = null
        },
        updateUserSuccess: (state, action: PayloadAction<User>) => {
            state.currentUser = action.payload
            state.loading = false
        },
        updateUserFailure: (state, action: PayloadAction<string>) => {
            state.loading = false
            state.error = action.payload
        },
        uploadAvatarRequest: (state) => {
            state.loading = true
            state.error = null
        },
        uploadAvatarSuccess: (state, action: PayloadAction<string>) => {
            if (state.currentUser) {
                state.currentUser.profilePictureUrl = action.payload
            }
            state.loading = false
        },
        uploadAvatarFailure: (state, action: PayloadAction<string>) => {
            state.loading = false
            state.error = action.payload
        },
    },
})

export const {
    getUserRequest,
    getUserSuccess,
    getUserFailure,
    updateUserRequest,
    updateUserSuccess,
    updateUserFailure,
    uploadAvatarRequest,
    uploadAvatarSuccess,
    uploadAvatarFailure,
} = userSlice.actions


export default userSlice.reducer

