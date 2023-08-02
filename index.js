import Telegraf from 'telegraf';
import env from 'dotenv';
import Stage from 'telegraf/stage.js';
import session from 'telegraf/session.js';

env.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Stage();

import downloadHandler from './handlers/scenes/download.js'

const dl = new downloadHandler(bot, stage);
dl.setWizard();

bot.use(session());
bot.use(stage.middleware());


bot.on('text', ctx => {
    return ctx.scene.enter('downloadScene')
});


bot.launch();