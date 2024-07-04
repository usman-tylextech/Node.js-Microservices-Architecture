const { CustomerRepository } = require("../database");
const { FormateData, GeneratePassword, GenerateSalt, GenerateSignature, ValidatePassword } = require('../utils');
const { APIError, BadRequestError } = require('../utils/app-errors')


// All Business logic will be here
class CustomerService {

    constructor(){
        this.repository = new CustomerRepository();
    }

    async SignIn(userInputs){

        const { email, password } = userInputs;
        
        try {
            
            const existingCustomer = await this.repository.FindCustomer({ email});

            if(existingCustomer){
            
                const validPassword = await ValidatePassword(password, existingCustomer.password, existingCustomer.salt);
                
                if(validPassword){
                    const token = await GenerateSignature({ email: existingCustomer.email, _id: existingCustomer._id});
                    return FormateData({id: existingCustomer._id, token });
                } 
            }
    
            return FormateData(null);

        } catch (err) {
            throw new APIError('Data Not found', err)
        }

       
    }

    async SignUp(userInputs){
        
        const { email, password, phone } = userInputs;
        
        try{
            // create salt
            let salt = await GenerateSalt();
            
            let userPassword = await GeneratePassword(password, salt);
            
            const existingCustomer = await this.repository.CreateCustomer({ email, password: userPassword, phone, salt});
            
            const token = await GenerateSignature({ email: email, _id: existingCustomer._id});

            return FormateData({id: existingCustomer._id, token });

        }catch(err){
            throw new APIError('Data Not found', err)
        }

    }

    async AddNewAddress(_id,userInputs){
        
        const { street, postalCode, city,country} = userInputs;
        
        try {
            const addressResult = await this.repository.CreateAddress({ _id, street, postalCode, city,country})
            return FormateData(addressResult);
            
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
        
    
    }

    async GetProfile(id){

        try {
            const existingCustomer = await this.repository.FindCustomerById({id});
            return FormateData(existingCustomer);
            
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
    }

    async GetShopingDetails(id){

        try {
            const existingCustomer = await this.repository.FindCustomerById({id});
    
            if(existingCustomer){
               return FormateData(existingCustomer);
            }       
            return FormateData({ msg: 'Error'});
            
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
    }

    async GetWishList(customerId){

        try {
            const wishListItems = await this.repository.Wishlist(customerId);
            return FormateData(wishListItems);
        } catch (err) {
            throw new APIError('Data Not found', err)           
        }
    }

    async AddToWishlist(customerId, product){
        try {
            const wishlistResult = await this.repository.AddWishlistItem(customerId, product);  
                
           return FormateData(wishlistResult);
    
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
    }

    async ManageCart(customerId, product, qty, isRemove){
        try {
            const cartResult = await this.repository.AddCartItem(customerId, product, qty, isRemove);        
            return FormateData(cartResult);
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
    }

    async ManageOrder(customerId, order){
        try {
            const orderResult = await this.repository.AddOrderToProfile(customerId, order);
            return FormateData(orderResult);
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
    }

    async SubscribeEvents(payload) {
        try {

            payload = JSON.parse(payload)
            console.log('Received payload:', JSON.stringify(payload, null, 2));
    
            
            let event, data;
            if (payload.data && payload.data.event && payload.data.data) {
              
                event = payload.data.event;
                data = payload.data.data;
            } else if (payload.event && payload.data) {
        
                event = payload.event;
                data = payload.data;
            } else {
                throw new BadRequestError('Invalid payload structure');
            }
    
            console.log('Event:', event);
            console.log('Data:', JSON.stringify(data, null, 2));
    
            const { userId, product, order, qty } = data;
    
            switch (event) {
                case 'ADD_TO_WISHLIST':
                    if (!userId || !product) {
                        throw new BadRequestError('Missing userId or product in ADD_TO_WISHLIST event');
                    }
                    await this.AddToWishlist(userId, product);
                    break;
                case 'REMOVE_FROM_WISHLIST':
                    if (!userId || !product) {
                        throw new BadRequestError('Missing userId or product in REMOVE_FROM_WISHLIST event');
                    }
                    await this.AddToWishlist(userId, product);
                    break;
                case 'ADD_TO_CART':
                    if (!userId || !product || qty === undefined) {
                        throw new BadRequestError('Missing userId, product, or qty in ADD_TO_CART event');
                    }
                    await this.ManageCart(userId, product, qty, false);
                    break;
                case 'REMOVE_FROM_CART':
                    if (!userId || !product || qty === undefined) {
                        throw new BadRequestError('Missing userId, product, or qty in REMOVE_FROM_CART event');
                    }
                    await this.ManageCart(userId, product, qty, true);
                    break;
                case 'CREATE_ORDER':
                    if (!userId || !order) {
                        throw new BadRequestError('Missing userId or order in CREATE_ORDER event');
                    }
                    await this.ManageOrder(userId, order);
                    break;
                default:
                    throw new BadRequestError(`Unhandled event type: ${event}`);
            }
        } catch (error) {
            console.error('Error processing event:', {
                errorMessage: error.message,
                errorStack: error.stack,
                receivedPayload: JSON.stringify(payload, null, 2)
            });
            throw error;
        }
    }
    
    
}

module.exports = CustomerService;