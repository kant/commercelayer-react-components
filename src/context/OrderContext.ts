import { createContext } from 'react'
import { orderInitialState, OrderState } from '../reducers/OrderReducer'

const OrderContext = createContext<OrderState>(orderInitialState)

export default OrderContext
