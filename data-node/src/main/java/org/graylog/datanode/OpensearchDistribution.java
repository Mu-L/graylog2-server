/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
package org.graylog.datanode;

import org.apache.commons.exec.OS;
import org.graylog.datanode.configuration.OpensearchArchitecture;

import javax.annotation.Nullable;
import java.nio.file.Path;

public record OpensearchDistribution(Path directory, String version, @Nullable String platform,
                                     @Nullable OpensearchArchitecture architecture) {

    public OpensearchDistribution(Path path, String version) {
        this(path, version, null, null);
    }

    public Path getOpensearchBinDirPath() {
        return directory.resolve("bin");
    }

    public Path getOpensearchExecutable() {
        return getOpensearchBinDirPath().resolve("opensearch");
    }

    public Path getOpensearchJavaHome() {
        if (OS.isFamilyMac()) {
            return directory.resolve("jdk-mac");
        } else {
            return directory.resolve("jdk");
        }
    }
}
