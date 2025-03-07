import {AppDispatch, RootState} from '../store'
import userService from '../services/userService'

import {
    getUserRequest,
    getUserSuccess,
    getUserFailure,
    updateUserRequest,
    updateUserSuccess,
    updateUserFailure,
    uploadAvatarRequest,
    uploadAvatarSuccess,
    uploadAvatarFailure,
} from '../reducers/userReducer'
import {setUser, setError} from "@/reducers/authReducer.ts"

export const getCurrentUser = (userId: string, currentRole?: string) => async (dispatch: AppDispatch) => {
    try {
        dispatch(getUserRequest())
        const data = await userService.getCurrentUser(userId)
        dispatch(getUserSuccess(data.data))
        // if (currentRole && currentRole !== data.data.role) {
        //     dispatch({type: 'auth/setUser', payload: data.data})
        // }
    } catch (error: any) {
        dispatch(getUserFailure(error.response?.data?.message || 'Failed to get current user'))
        dispatch(setError(error.response?.data?.message || 'Failed to get current user'))
    }
} //TODO

export const getUserById = (userId: string) => async (dispatch: AppDispatch) => {
    try {
        dispatch(getUserRequest())
        const data = await userService.getUserById(userId)
        dispatch(getUserSuccess(data.data))
    } catch (error: any) {
        dispatch(getUserFailure(error.response?.data?.message || 'Failed to get user'))
        dispatch(setError(error.response?.data?.message || 'Failed to get user'))
    }
}

export const updateCurrentUser = (userData: any, userId: string) => async (dispatch: AppDispatch) => {
    try {
        dispatch(updateUserRequest())
        const data = await userService.updateCurrentUser(userData, userId)
        dispatch(updateUserSuccess(data.data))
        dispatch({type: 'auth/setUser', payload: data.data})
    } catch (error: any) {
        dispatch(updateUserFailure(error.response?.data?.message || 'Failed to update user'))
        dispatch(setError(error.response?.data?.message || 'Failed to update user'))
        throw error;
    }
}



export const uploadAvatar = (formData: FormData, userId: string) => async (dispatch: AppDispatch) => {
    try {
        dispatch(uploadAvatarRequest())
        const data = await userService.uploadAvatar(formData)
        dispatch(uploadAvatarSuccess(data.server_filename))
        const updatedData = await userService.updateCurrentUser({profile_picture_name: data.server_filename}, userId)
        dispatch(updateUserSuccess(updatedData.data))
        dispatch({type: 'auth/setUser', payload: updatedData.data})
    } catch (error: any) {
        dispatch(uploadAvatarFailure(error.response?.data?.message || 'Failed to upload avatar'))
        dispatch(setError(error.response?.data?.message || 'Failed to upload avatar'))
    }
}

