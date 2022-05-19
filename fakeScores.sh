#!/bin/sh
aws sns publish \
    --message-group-id 'potato' \
    --message '{"boardName":"potato","scoreDeltas":[{"playerId":"dd3cb41b-6428-45b8-81e6-82d57f5a5508","score":[-3]},{"playerId":"7b53dd5f-33b3-4815-be6b-d40d831b365c","score":[31]}]}' \
    --topic-arn "arn:aws:sns:us-west-2:163871723185:score-fifo-topic-2.fifo"
