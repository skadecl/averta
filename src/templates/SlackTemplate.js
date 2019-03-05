export default {
  text: '%a deployed %tp%nv to %r',
  type: 'message',
  username: 'Averta',
  icon_url: 'https://raw.githubusercontent.com/skadecl/averta/master/src/assets/images/averta_icon.png',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*%a* deployed a new version to *<%rL|%r>*.',
      }
    }
  ],
  attachments: [
    {
      color: '#36a64f',
      blocks: [
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: '*Commit:* <%cL|#%h>'
            },
            {
              type: 'mrkdwn',
              text: '*Branch:* <%bL|%b>'
            },
            {
              type: 'mrkdwn',
              text: '*Increment:* %i'
            },
            {
              type: 'mrkdwn',
              text: '*Type:* %p'
            },
            {
              type: 'mrkdwn',
              text: '*Old version:* <%ovL|%ov>'
            },
            {
              type: 'mrkdwn',
              text: '*New version:* <%nvL|%nv>'
            }
          ]
        }
      ]
    }
  ]
};
