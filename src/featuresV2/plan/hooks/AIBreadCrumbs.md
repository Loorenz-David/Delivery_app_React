Porpose: 
- hooks for interacting with the ./api for plans and keep the store in sync
- handles fetch errors with try except 
- handles rollbacks 
- handles data validation with clear logs on mutations or errors

Rules:
- uses the ./api for plans 
- uses the ./store for plans and the apropiate selectors and actions.
- for displaying UI errors it uses the showMessage from the message_manager/.

- a hook file for each type of responsability mutation and selectors. 
- on create injects a client_id a unique id (str) generated for optimistic updates. 

Notes:
- on the api call for get plan list the hook calling this api should set up the plan store with the return objects on the key delivery_plan. And the plan stats and pagination on the plan list store.

- on the api call for creating the object will have one of three plan types as key : international_shipping_plan, local_delivery_plan, store_pickup_plan, the value is of these key is the plan type fields need it to create an instance at the back end. the plan fields will have a key call "plan_type" with one of the three plan type values: international_shipping_plan, local_delivery_plan, store_pickup_plan. ( i assume you get what im trying to do, otherwise check the create_plan.py for guidance ). on the fields for the plan type you should also inject a unique client_id. 
it stores the plan fields with out the plan type key on the plan store, using the client_id as key. and it also stores the plan type fields on the correct plan type store, using the client_id as key.
on error it handles roll back and display the error message using the message_manager/. on sucess the router returns a map with {"delivery_plan":{client_id: id (db id), ...could be more if batch}, "plan_type":{client_id: id (db id)}, ... could also be more if batch  }. It updates the key id: return value, on both store instances.

- on the api call for updating  a plan, same as create plan it notifies errors with message_manager/ , updates the plan store and handles roll backs. the object being send will be a delivery plan object with plan_type and the value of plan_type as key for the fields of plan type ( check the update_plan.py if is not clear), it should the plan store and the selected plan type store if any fields to update.

- on the api call for deleting a plan, it only passes the plan id, the back end is configure to delete the plan type instance, but it should update the plan store and the plan type store, you can use the plan id to find both instances in the stores.

- on the api call for obtaining the plan type of a plan it uses the id and the "plan_type" of the plan isntance, on success it should update the target plan type store accordingly. the object return for any target plan type is {delivery_plan_type: {client_id: object }}

- on the api call for updating the state of a plan, it uses the plan id and the state_id. updates the plan accordingly using the plan store action for changing the state_id of a plan. before the call is even made a check must be performed, using the plan state hook it should check for valid transition.


- the api for the plan router call will return an object with the following structure:
{ 
    delivery_plan: 
        { 
            byClientId: 
                { client_id: object }, 
            allIds: 
            [ list of client_ids ] 
        },
    delivery_plan_stats: {
        "plans": {
            "total": total_plans,
            "by_state": { state_id: count }
        },
        "orders":{
            "total": orders_count
        },
        "items":{
            "total": item_count
        }
    }
    
    delivery_plan_pagination:{
        "has_more": boolean,
        "next_cursor": {
            after_date: date string isoformat , 
            after_id: id
        },
        "prev_cursor": {
            before_date: date string isoformat , 
            before_id: id
        },
    }
},






