#!/bin/sh
aws sns publish \
    --message-group-id 'potato' \
    --message '{"boardName":"potato.v1","scoreDeltas":[{"playerId":"dd3cb41b-6428-45b8-81e6-82d57f5a5508","score": [-1]}]}' \
    --topic-arn "arn:aws:sns:us-west-2:163871723185:score-fifo-topic-2.fifo"
