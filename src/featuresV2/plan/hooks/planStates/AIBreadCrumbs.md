Porpose: 
- hooks for interacting with the ./api for plans states and keep the store in sync
- handles fetch errors with try except 


Rules:
- uses the ../store  for plan states and the apropiate selectors and actions.

- for displaying UI errors it uses the showMessage from the message_manager/.

- a hook file for each type of responsability mutation, get store instances or instance. 



Note:
there should be a hook for checking the allowed next state using the transition variable on the plan state store.

