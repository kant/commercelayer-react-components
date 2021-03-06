import React, { FunctionComponent, useContext, PropsWithoutRef } from 'react'
import Parent from './utils/Parent'
import OrderContext from '../context/OrderContext'
import _ from 'lodash'
import ItemContext from '../context/ItemContext'
import getCurrentItemKey from '../utils/getCurrentItemKey'
import components from '../config/components'
import { FunctionChildren } from '../typings/index'
import { AddToCartReturn } from 'reducers/OrderReducer'
import SkuListsContext from '../context/SkuListsContext'
import ExternalFunctionContext from '../context/ExternalFunctionContext'
import { VariantOptions } from '../../dist/components/VariantSelector'

const propTypes = components.AddToCartButton.propTypes
const defaultProps = components.AddToCartButton.defaultProps
const displayName = components.AddToCartButton.displayName

type AddToCartButtonChildrenProps = FunctionChildren<
  {
    handleClick: () => AddToCartReturn
  } & Omit<AddToCartButtonProps, 'children'> &
    PropsWithoutRef<JSX.IntrinsicElements['button']>
>

type AddToCartButtonProps = {
  children?: AddToCartButtonChildrenProps
  label?: string
  skuCode?: string
  disabled?: boolean
  skuListId?: string
  lineItem?: VariantOptions['lineItem']
} & PropsWithoutRef<JSX.IntrinsicElements['button']>

const AddToCartButton: FunctionComponent<AddToCartButtonProps> = (props) => {
  const {
    label = 'Add to cart',
    children,
    skuCode,
    disabled,
    skuListId,
    lineItem,
    ...p
  } = props
  const { addToCart, orderId, getOrder, setOrderErrors } = useContext(
    OrderContext
  )
  const { url, callExternalFunction } = useContext(ExternalFunctionContext)
  const {
    item,
    items,
    quantity,
    option,
    prices,
    lineItems,
    lineItem: lineItemContext,
    skuCode: itemSkuCode,
  } = useContext(ItemContext)
  const { skuLists } = useContext(SkuListsContext)
  const sCode =
    !_.isEmpty(items) && skuCode
      ? items[skuCode]?.code
      : skuCode || getCurrentItemKey(item) || (itemSkuCode as string)
  const handleClick = () => {
    const qty = quantity[sCode]
    const opt = option[sCode]
    const customLineItem = !_.isEmpty(lineItem || lineItemContext)
      ? lineItem || lineItemContext
      : lineItems[sCode]
    if (!_.isEmpty(skuLists) && skuListId && url) {
      const slQty = quantity[skuListId] || 1
      if (_.has(skuLists, skuListId)) {
        const lineItems = skuLists[skuListId].map((skuCode) => {
          return {
            skuCode,
            quantity: slQty,
            _update_quantity: 1,
          }
        })
        return callExternalFunction({
          url,
          data: {
            resourceType: 'orders',
            inputs: [
              {
                id: orderId,
                lineItems,
              },
            ],
          },
        })
          .then((res) => {
            getOrder && getOrder(orderId)
            return res
          })
          .catch(({ response }) => {
            setOrderErrors(response['data'])
            return response
          })
      }
    }
    return !url
      ? addToCart({
          skuCode: sCode,
          skuId: item[sCode]?.id,
          quantity: qty,
          option: opt,
          lineItem: customLineItem,
        })
      : callExternalFunction({
          url,
          data: {
            skuCode: sCode,
            skuId: item[sCode]?.id,
            quantity: qty,
            option: opt,
            lineItem: customLineItem,
          },
        })
          .then((res) => {
            getOrder && getOrder(orderId)
            return res
          })
          .catch(({ response }) => {
            setOrderErrors(response['data'])
            return response
          })
  }
  const autoDisabled =
    !_.isEmpty(skuLists) || skuListId
      ? false
      : disabled || !prices[sCode] || !sCode
  const parentProps = {
    handleClick,
    disabled: disabled || autoDisabled,
    label,
    ...props,
  }
  return children ? (
    <Parent {...parentProps}>{children}</Parent>
  ) : (
    <button disabled={autoDisabled} onClick={handleClick} {...p}>
      {label}
    </button>
  )
}

AddToCartButton.propTypes = propTypes
AddToCartButton.defaultProps = defaultProps
AddToCartButton.displayName = displayName

export default AddToCartButton
