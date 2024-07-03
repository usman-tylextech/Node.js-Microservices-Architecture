const ShoppingService = require("../services/shopping-service");
const UserAuth = require('./middlewares/auth');
const { PublishCustomEvent } = require("../utils");

module.exports = (app) => {
    
    const service = new ShoppingService();
   
    app.post('/order',UserAuth, async (req,res,next) => {

        const { _id } = req.user;
        const { txnNumber } = req.body;
          
        console.log("txnNumber for txId:" , txnNumber);
        console.log("user id for txId:" , _id);

        try {
            const { data } = await service.PlaceOrder({_id, txnNumber});

             const payload = await service.GetOrderBypayload(_id, data, 'CREATE_ORDER')
              
             PublishCustomEvent(payload);

            return res.status(200).json(data);
            
        } catch (err) {
            next(err)
        }

    });

    app.get('/orders',UserAuth, async (req,res,next) => {

        const { _id } = req.user;

        try {
            const { data } = await service.GetOrders(_id);
            return res.status(200).json(data)
        } catch (err) {
            next(err);
        }

    });
       
    
    app.get('/cart', UserAuth, async (req,res,next) => {

        const { _id } = req.user;
        try {
            const { data } = await service.getCart({_id});
            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });
}