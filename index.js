/*
 * Copyright 2018-2020 Capability LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

const errors = require("./errors");

// Do not leak error information when loading code.
// Unexpected errors may return 503 Service Unavailable or just exit.
let _callback;
process.on("uncaughtException", error =>
    {
        console.error(error);
        if (_callback)
        {
            return _callback(undefined, new errors.ServiceUnavailable());
        }
        process.exit(1);
    }
);

const AWS = require("aws-sdk");
const events = require("events");
const pkg = require("./package.json");

class Recipient extends events.EventEmitter
{
    constructor(config)
    {
        super();

        const self = this;
        self._config = config;
        self.name = pkg.name;
        self.version = pkg.version;

        self._config = config;

        const configValidationResult = require("./schema/config/instantiated.js").validate(
            self._config,
            {
                abortEarly: false,
                convert: false
            }
        );
        if (configValidationResult.error)
        {
            throw configValidationResult.error;
        }

        self._s3 = new AWS.S3();
    }

    static config(config, callback)
    {
        const configValidationResult = require("./schema/config/uninstantiated.js").validate(
            config,
            {
                abortEarly: false,
                convert: false
            }
        );
        if (configValidationResult.error)
        {
            throw configValidationResult.error;
        }
        return callback(config);
    }

    static handle(message, context, callback)
    {
        _callback = callback; // return 503 Service Unavailable on uncaught error
        if (!Recipient.instance)
        {
            Recipient.config(JSON.parse(process.env.USERDATA), config =>
                {
                    Recipient.instance = new Recipient(config);
                    Recipient.instance.handle(message, context, callback);
                }
            );
        }
        else
        {
            Recipient.instance.handle(message, context, callback);
        }
    }

    handle(message, context, callback)
    {
        _callback = callback; // testing artifact
        const self = this;
        if (context.testAbort)
        {
            return self._end(new errors.ServiceUnavailable());
        }
        return self._receiveCertificate(message, context);
    }

    _end(error, response)
    {
        const self = this;
        setImmediate(_ => self.emit("end"));
        // Non-crash errors are treated as successful Lambda executions and
        // passed in place of a response.
        setImmediate(_ => _callback(undefined, error ? error : response));
    }
};

Recipient.instance = undefined;
Recipient.version = pkg.version;

[
    "receiveCertificate"
]
.map(handler =>
    {
        Recipient.prototype[`_${handler}`] = require(`./handlers/${handler}.js`);
    }
);

module.exports = Recipient;
