<template>
    <v-dialog v-model="show" max-width="700">
        <template v-slot:activator="{ on }">
            <v-btn v-if="enabled" v-text="$t('aria2RPCSettings')" color="primary" @click="onShow" id="btn-show"></v-btn>
        </template>
        <v-card>
            <v-card-title class="headline">
                <span>{{ $t('aria2RPCSettings') }}</span>
            </v-card-title>
            <v-card-text>
                <v-container>
                    <v-row>
                        <v-text-field :label="$t('aria2RPCHost')" v-model="rpcHost"></v-text-field>
                    </v-row>
                    <v-row>
                        <v-text-field :label="$t('aria2RPCPort')" v-model="rpcPort"></v-text-field>
                    </v-row>
                    <v-row>
                        <v-text-field :label="$t('aria2RPCPath')" v-model="rpcPath"></v-text-field>
                    </v-row>
                    <v-row>
                        <v-text-field :label="$t('aria2RPCToken')" v-model="rpcToken"></v-text-field>
                    </v-row>
                    <v-row>
                        <v-text-field :label="$t('aria2RPCDownloadPath')" v-model="downloadPath"></v-text-field>
                    </v-row>
                    <v-row>
                        <v-switch :label="$t('aria2RPCSecure')" v-model="rpcSecure"></v-switch>
                    </v-row>
                    <v-row>
                        <v-text-field :label="$t('fetchConcurrency')" v-model="fetchConcurrency"></v-text-field>
                    </v-row>
                    <v-row>
                        <v-text-field :label="$t('fetchRetryTimes')" v-model="fetchRetryTimes"></v-text-field>
                    </v-row>
                    <v-row>
                        <v-text-field :label="$t('optionSplit')" v-model="optionSplit"></v-text-field>
                    </v-row>
                    <v-row>
                        <v-text-field
                            :label="$t('optionMaxConnectionPerServer')"
                            v-model="optionMaxConnectionPerServer"
                        ></v-text-field>
                    </v-row>
                </v-container>
                <v-alert dense type="warning" v-if="shouldShowAriaHTTPSWarning">
                    {{ $t('aria2HTTPSWarning') }}
                </v-alert>
                <template>
                    <v-alert dense type="info" v-if="testStatus === 0">
                        {{ $t('aria2Testing') }}
                    </v-alert>
                    <v-alert dense type="success" v-if="testStatus === 1">
                        {{ $t('aria2TestSucceed', { version: testVersion }) }}
                    </v-alert>
                    <v-alert dense type="error" v-if="testStatus === 2">
                        {{ $t('aria2TestFailed', { reason: testFailedReason }) }}
                    </v-alert>
                </template>
            </v-card-text>
            <v-card-actions id="actions">
                <v-btn color="primary" @click="test" v-text="$t('aria2TestConnection')" text></v-btn>
                <v-btn color="primary" @click="saveAndClose" v-text="$t('save')" text></v-btn>
                <v-btn @click="close" v-text="$t('cancel')" text></v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import aria2 from '../aria2';
import util from '../util';

export default {
    data() {
        return {
            show: false,
            enabled: window.props.download_aria2,
            rpcHost: '',
            rpcSecure: false,
            rpcPort: 6800,
            rpcPath: '/jsonrpc',
            rpcToken: '',
            downloadPath: '',
            fetchConcurrency: 5,
            fetchRetryTimes: 3,
            testStatus: -1,
            testVersion: '',
            testFailedReason: '',
            shouldShowAriaHTTPSWarning: false,
            optionSplit: '2',
            optionMaxConnectionPerServer: '2'
        };
    },
    computed: {},
    watch: {
        rpcSecure: function(val) {
            this.shouldShowAriaHTTPSWarning = util.usingHTTPS() && !val;
        }
    },
    methods: {
        onShow: function() {
            this.load();
            this.show = true;
        },
        load: function() {
            this.rpcHost = aria2.getRpcHost();
            this.rpcPort = aria2.getRpcPort();
            this.rpcSecure = aria2.getRpcSecure();
            this.rpcPath = aria2.getRpcPath();
            this.rpcToken = aria2.getRpcToken();
            this.downloadPath = aria2.getDownloadPath();
            this.fetchConcurrency = aria2.getFetchConcurrency();
            this.fetchRetryTimes = aria2.getFetchRetryTimes();
            this.optionSplit = aria2.getOptionSplit();
            this.optionMaxConnectionPerServer = aria2.getOptionMaxConnectionPerServer();

            this.shouldShowAriaHTTPSWarning = util.usingHTTPS() && !this.rpcSecure;
        },
        save: function() {
            aria2.setRpcHost(this.rpcHost);
            aria2.setRpcPort(this.rpcPort);
            aria2.setRpcSecure(this.rpcSecure);
            aria2.setRpcPath(this.rpcPath);
            aria2.setRpcToken(this.rpcToken);
            aria2.setDownloadPath(this.downloadPath);
            aria2.setFetchConcurrency(this.fetchConcurrency);
            aria2.setFetchRetryTimes(this.fetchRetryTimes);
            aria2.setOptionSplit(this.optionSplit);
            aria2.setOptionMaxConnectionPerServer(this.optionMaxConnectionPerServer);
        },
        test: function() {
            this.save();

            this.testStatus = 0;
            aria2.init();
            aria2.test().then(
                result => {
                    this.testStatus = 1;
                    this.testVersion = result.version;
                },
                reason => {
                    this.testStatus = 2;
                    this.testFailedReason = reason;
                }
            );
        },
        saveAndClose: function() {
            this.save();
            this.close();
        },
        close: function() {
            this.show = false;
        }
    }
};
</script>
<style>
#actions {
    justify-content: flex-end;
}

#btn-show {
    margin-right: 10px;
}
</style>
