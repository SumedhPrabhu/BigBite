//fetch cart
//Add items
//update quantity
//remove items
//handle loading and  errors

import api from "../../utils/api"
import {
     cartRequest,
    cartSuccess,
    cartFail,
    updateCartSuccess,
    removeCartSuccess,
} from "../slices/cartSlice"

//fetch cart items

export const fetchCartItems =() =>async(dispatch) =>{
    try{
       dispatch(cartRequest());

       const {data} = await api.get("/api/v1/eats/cart/get-cart");

       dispatch(cartSuccess(data.data))
       console.log("CART API", data.data)
    }catch(error){
            dispatch(cartFail(error.response?.data?.message))
    }
}

//add cart items
export const addItemToCart =(foodItemId, restaurantId, quantity) =>async(dispatch,getState) =>{
    try{
         dispatch(cartRequest());

         const{user} = getState().user;

         const{data} = await api.post("/api/v1/eats/cart/add-to-cart" ,{
            userId:user._id,
            foodItemId,
            restaurantId,
            quantity
         })

         dispatch(cartSuccess(data.cart))
    }catch(error){
        dispatch(cartFail(error.response?.data?.message))
    }
}

//update cart quantity

export const updateCartQuantity = (foodItemId,quantity) => async(dispatch,getState) =>{
    try{
       const {user} = getState().user;
       const {data} = await api.post("/api/v1/eats/cart/update-cart-item", {
        userId: user._id,
        foodItemId,
        quantity
       })

       dispatch(updateCartSuccess(data.cart))
    }catch(error){
          dispatch(cartFail(error.response?.data?.message))
    }
}

//remove item from cart
export const removeItemFromCart = (foodItemId) => async(dispatch,getState) =>{
    try{
        const {user} = getState().user;

        const {data} = await api.delete("/api/v1/eats/cart/delete-cart-item", {
            data:{userId:user._id, foodItemId}
        })

        dispatch(removeCartSuccess(data))

    }catch(error){
         dispatch(cartFail(error.response?.data?.message))
    }
}
