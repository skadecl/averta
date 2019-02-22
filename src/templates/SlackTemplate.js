export default {
  text: 'Preview content',
  type: 'message',
  username: 'Averta',
  icon_emoji: ':robot_face:',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*A new version has been tagged into %r.*',
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '*Version:* %nv'
        }
      ]
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '*Branch:* %b'
        }
      ]
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '*Type:* %p'
        }
      ]
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '*Increment:* %i'
        }
      ]
    },
    {
      type: 'divider'
    }
  ]
};
