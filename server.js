'use strict'

const Koa = require('koa')
const { PassThrough } = require('stream')
const serve = require('koa-static')
const bodyparser = require('koa-bodyparser')

const streams = new Set()

new Koa()
  .use(async (ctx, next) => {
    if (ctx.path !== '/stream') return next()

    ctx.request.socket.setTimeout(0)
    ctx.req.socket.setNoDelay(true)
    ctx.req.socket.setKeepAlive(true)

    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })

    const stream = new PassThrough()

    ctx.status = 200
    ctx.body = stream

    streams.add(stream)

    stream.once('close', () => streams.delete(stream))
  })
  .use(bodyparser({ enableTypes: ['text'] }))
  .use(async (ctx, next) => {
    if (ctx.path !== '/messages') return next()
    ctx.status = 201
    ctx.body = 'OK'
    const value = ctx.request.body
    console.log(`Sending: ${value} to ${streams.size} stream/s`)

    streams.forEach((stream) => stream.write(`data: ${JSON.stringify(value)}\n\n`))
  })
  .use(serve('public/'))
  .listen(8080, () => console.log('Listening'))
