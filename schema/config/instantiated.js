/*
 * Copyright 2018-2019 Capability LLC. All Rights Reserved.
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

const Joi = require("@hapi/joi");

module.exports = Joi.object().keys(
    {
        aws: Joi.object().keys(
            {
                s3: Joi.object().keys(
                    {
                        bucket: Joi.string().required()
                    }
                ).required()
            }
        ).required()
    }
).required();
