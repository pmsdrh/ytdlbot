import ytdl from 'ytdl-core';

class DownloadHandler {
    constructor(bot) {
        this.bot = bot;
    }
    async getInfo(url) {
        const info = await ytdl.getInfo(url);
        let formates = [];

        for (let ft of info.formats) {
            formates.push({
                quality: ft.qualityLabel,
                container: ft.container
            })
        }
        return formates
    }

    setHandler(){
        this.bot.on('text', async ctx => {
            const url = ctx.message.text;
            const buttons = [];
            let direction = [];
            if (ytdl.validateURL(url)) {
                const info = await this.getInfo(url);
                for (let ft of info) {
                    direction.push({
                        text: `${ft.quality},${ft.container}`,
                        callback_data: `dl-${ft.quality}-${ft.container}`
                    });
                    if (direction.length === 2) {
                        buttons.push(direction);
                        direction = []
                    }
                }
                ctx.reply('choose',{
                    reply_markup: {
                        inline_keyboard: buttons
                    }
                })
            }
        })
    }
}

export default DownloadHandler;