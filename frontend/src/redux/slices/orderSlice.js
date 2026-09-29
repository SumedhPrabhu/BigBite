import {createSlice} from "@reduxjs/toolkit"

const initialState ={
    loading: false,
    error:null,
    order:null,
    orders:[]
}

const orderSlice = createSlice({
    name:"order",
    initialState,
    reducers:{
        ////common
        clearErrors:(state)=>{
            state.error= null
        },
        //create order
        createOrderRequest:(state)=>{
            state.loading=true;
        },
        createOrderSuccess:(state,action)=>{
            state.loading= false,
            state.order= action.payload
        },
        createOrderFail:(state,action)=>{
             state.loading= false,
            state.error= action.payload
        },
        //payment
        paymentRequest:(state)=>{
            state.loading=true;
        },
        paymentSuccess:(state)=>{
            state.loading= false   
        },
        paymentFail:(state,action)=>{
             state.loading= false,
            state.error= action.payload
        },

        //My orders
        myOrdersRequest:(state)=>{
            state.loading=true;
        },
        myOrdersSuccess:(state,action)=>{
            state.loading= false,
            state.orders= action.payload
        },
        myOrdersFail:(state,action)=>{
             state.loading= false,
            state.error= action.payload
        },

        // Order details
        orderDetailsRequest:(state)=>{
            state.loading=true;
        },
        orderDetailsSuccess:(state,action)=>{
            state.loading= false,
            state.order= action.payload
        },
        orderDetailsFail:(state,action)=>{
             state.loading= false,
            state.error= action.payload
        },

    }
})

export const {
    clearErrors,
    createOrderRequest,
    createOrderSuccess,
    createOrderFail,
    paymentRequest,
    paymentSuccess,
    paymentFail,
    myOrdersRequest,
    myOrdersSuccess,
    myOrdersFail,
    orderDetailsRequest,
    orderDetailsSuccess,
    orderDetailsFail
} = orderSlice.actions

export default orderSlice.reducer