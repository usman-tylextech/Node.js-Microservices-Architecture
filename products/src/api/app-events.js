


module.exports = (app) =>{

    app.use('/app-events' , async (req, res, next) =>{

        const {playload} = req.body;

        service.SubscribeEvents(playload)
        console.log("========== Product Service Event ==========")
        return res.status(200).json(playload)
})


}