Purpose:
- TypeScript `type` definitions for data returned from fetch calls from ./api

Rules:
- Use `type`
- one file for plan, one file per plan types, another for plan state, another for plan stats,paginations, query fileters

the way data will be fetch in can be found in:
- serialize_plan.py
- serialize_local_delivery_plan.py
- serialize_international_shipping_plan.py
- serialize_store_pickup_plan.py
- serialize_

the way a plan is fetch to the backend for creation is with the DeliveryPlan fields and the DeliveryPlan type fields will be place under one of three keys: international_shipping_plan, local_delivery_plan, store_pickup_plan
the key "delivery_plan" is a string with one of those values also. you can see create_plan.py to understand what i mean. 







