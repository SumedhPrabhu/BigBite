import {createSlice} from "@reduxjs/toolkit"

//create initialstate
const initialState ={
    user:null,
    loading:false,
    isAuthenticated:false,
    error:null,
    isUpdated:false,
    message: null,
    success:null
}


const userSlice = createSlice({
    name: "user",
    initialState,
    reducers:{
        //Login/register/load
        loginRequest:(state) =>{
            state.loading= true;
            state.isAuthenticated= false
        },
        loginSuccess :(state,action) =>{
            state.loading =false;
            state.isAuthenticated =true
            state.user = action.payload // store user data
        },
        loginFail: (state,action) =>{
            state.loading =false;
            state.isAuthenticated =false
            state.user = null
            state.error = action.payload
        },

        //LOAD user fail
        loadUserFail:(state,action) =>{
            state.loading =false;
            state.isAuthenticated =false
            state.user = null,
            state.error= action.payload
        },

        //Logout
        logoutSuccess: (state)=>{
             state.loading =false;
            state.isAuthenticated =false
            state.user = null
        },

        //Logout fail
        logoutFail:(state,action)=>{
            state.error = action.payload
        },
        
        //Update Profile/ password
        updateRequest:(state) =>{
            state.loading =true;
        },
        updateSuccess:(state,action) =>{
            state.loading =false,
            state.isUpdated= action.payload
        },
        updateFail:(state,action)=>{
            state.loading =false,
            state.error= action.payload
        },
        updateReset:(state)=>{
            state.isUpdated=false;
        },

        //clear Error
        clearErrors:(state) =>{
            state.error = null
        }
    }

})


export const {
    loginRequest,
    loginSuccess,
    loginFail,
    loadUserFail,
    logoutSuccess,
    logoutFail,
    updateRequest,
    updateSuccess,
    updateFail,
    updateReset,
    clearErrors
} = userSlice.actions

export default userSlice.reducer