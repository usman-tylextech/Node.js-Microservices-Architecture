const Customerservice = require('../services/customer-service.js');


module.exports = (app) =>{

    const service = new Customerservice();
    app.use('/app-events' , async (req, res, next) =>{

        const {payload} = req.body;
        console.log("CUSTOMER SERVICE PAYLOD -----> ",payload );
        service.SubscribeEvents(payload)

        console.log("========== Customer Service Received  Event ==========")
        return res.status(200).json(payload);
})


}