import Composer from 'telegraf/composer.js';
import WizardScene from 'telegraf/scenes/wizard/index.js';
import ytdl from 'ytdl-core';
import fs from 'fs';

class downloadHandler {
    constructor(app, stage) {
        this.app = app;
        this.stage = stage;
    }
    Cancel(ctx) {
        try {
            const { replyWithHTML, scene } = ctx;
            ctx.deleteMessage().catch(e => {});
            scene.leave();
            return replyWithHTML('ℹ️ Main Menu.');
        } catch (err) {
            console.log('-- Cancel Error: ', err);
        }
    }
    async getInfo(url) {
        const info = await ytdl.getInfo(url);
        let formates = [];
        for (let ft of info.formats) {
            formates.push({
                tag: ft.itag,
                quality: ft.qualityLabel,
                container: ft.container,
                hasAudio: ft.hasAudio,
                hasVideo: ft.hasVideo
            })
        }
        return formates
    }
    async stepOne(ctx) {
        const url = ctx.message.text;
        ctx.scene.session.state.url = url;
        const buttons = [];
        let direction = [];

        const buttons_na = [];
        let direction_na = [];

        const buttons_nv = [];
        let direction_nv = [];
        if (ytdl.validateURL(url)) {
            const info = await this.getInfo(url);
            for (let ft of info) {
                if (ft.hasAudio){
                    if (ft.hasVideo){
                        direction.push({
                            text: `${ft.quality},${ft.container}`,
                            callback_data: `dl-${ft.tag}-${ft.hasVideo}-${ft.hasAudio}-${ft.container}`
                        });
                    } else {
                        direction_nv.push({
                            text: `${ft.quality},${ft.container}`,
                            callback_data: `dl-${ft.tag}-${ft.hasVideo}-${ft.hasAudio}-${ft.container}`
                        });
                    }
                } else {
                    direction_na.push({
                        text: `${ft.quality},${ft.container}`,
                        callback_data: `dl-${ft.tag}-${ft.hasVideo}-${ft.hasAudio}-${ft.container}`
                    })
                }
                if (direction.length === 2) {
                    buttons.push(direction);
                    direction = [];
                } else if (direction_na.length === 2){
                    buttons_na.push(direction_na);
                    direction_na = [];
                } else if (direction_nv.length === 2){
                    buttons_nv.push(direction_nv);
                    direction_nv = [];
                }
            }
            if (direction.length){
                buttons.push(direction)
            } else if (direction_na.length) {
                buttons_na.push(direction_na)
            } else if (direction_nv.length) {
                buttons_nv.push(direction_nv)
            }
            buttons.push([{
                text: 'No Audio ⬇️',
                callback_data: 'info-No-Audio'
            }]);
            buttons.push(...buttons_na);
            buttons.push([{
                text: 'Only Audio ⬇️',
                callback_data: 'info-Only-Audio'
            }]);
            buttons.push(...buttons_nv);
            buttons.push([{
                text: 'cancel',
                callback_data: 'cancel'
            }]);
            await ctx.reply('choose', {
                reply_markup: {
                    inline_keyboard: buttons
                }
            });
            ctx.wizard.next()
        }

    }
    stepTwo(){
        const stepTwoHandler = new Composer();
        stepTwoHandler.action('cancel', ctx => this.Cancel(ctx));
        stepTwoHandler.action(/dl-[\w-]*/i, async ctx => {
            const data = ctx.callbackQuery.data.replace('dl-', '').split('-');
            ctx.editMessageText('Downloading...');
            const options = {
                filter: format => format.hasVideo === JSON.parse(data[1])
                    && format.itag === parseInt(data[0])
                    && format.hasAudio === JSON.parse(data[2])
            };
            const length = 15;
            const charset = "_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789abcdefghijklmnopqrstuvwxyz";
            let filename = "";
            for (let i = 0, n = charset.length; i < length; ++i) {
                filename += charset.charAt(Math.floor(Math.random() * n));
            }

            const ytstream = ytdl(ctx.scene.session.state.url, options);
            ytstream.pipe(fs.createWriteStream(`./others/upload/${filename}.${data[3]}`));
            ytstream.on('end', async () => {
                ctx.editMessageText('Done.');
                if (!JSON.parse(data[1]) && JSON.parse(data[2])){
                    return await ctx.replyWithAudio({
                        source:`./others/upload/${filename}.${data[3]}`
                    })
                }
                await ctx.replyWithVideo({
                    source: `./others/upload/${filename}.${data[3]}`
                })
            });

            return ctx.scene.leave();
        });
        return stepTwoHandler;
    }


    async setWizard() {
        await this.stage.register(
            new WizardScene(
                'downloadScene',
                ctx => this.stepOne(ctx),
                this.stepTwo()
            )
        );
    }

}

export default downloadHandler;