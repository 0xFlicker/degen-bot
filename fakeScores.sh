#!/bin/sh
aws sns publish \
    --message-group-id 'potato' \
    --message '{"boardName":"potato","scores":[{"playerId":"dd3cb41b-6428-45b8-81e6-82d57f5a5508","score":[146]},{"playerId":"b5ad4c7d-f43d-4c96-ae98-637d43f8f88d","score":[31]}]}' \
    --topic-arn "arn:aws:sns:us-west-2:163871723185:score-fifo-topic-2.fifo"
