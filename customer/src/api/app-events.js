const Customerservice = require('../services/customer-service.js');


module.exports = (app) =>{

    const service = new Customerservice();
    app.use('/app-events' , async (req, res, next) =>{

        const {playload} = req.body;

        service.SubscribeEvents(playload)
        console.log("========== Shopping Service Event ==========")
        return res.status(200).json(playload)
})


}