import { RmqContext } from '@nestjs/microservices';

export function sendAck(ctx: RmqContext) {
  const channel = ctx.getChannelRef();
  const originalMsg = ctx.getMessage();

  return channel.ack(originalMsg);
}
