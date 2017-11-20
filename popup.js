//page tabs enum
const Tabs = {
    list: 'list',
    add: 'add',
    settings: 'settings',
    edit: 'edit'
}
//mail view model
function Mail(data) {
    data = data || {};
    this.user = ko.observable(data.user);//email address
    this.password = ko.observable(data.password);//email password
    this.host = ko.observable(data.host);//host
    this.port = ko.observable(data.port || 993);//port
    this.name = ko.observable(data.name || '');//remark
    this.tls = ko.observable(data.tls || true);//whether use tls
    this.unseen = ko.observable(data.unseen);//unseen count
    this.error = ko.observable();//whether existing problem 
    this.displayName = ko.computed(() => {//compute the display name in the 'list' tab
        return this.name() || this.user();
    }, this);
}

function EmailListViewModel() {
    this.mails = ko.observableArray([]);//mail list
    this.newMail = ko.observable(new Mail());//mail view model exist in the 'add' tab
    this.editingMail = ko.observable();//mail view model exist in the 'edit' tab
    this.settingsError = ko.observable();//some error in the 'settings' tab
    this.add = () => {
        var mail = this.newMail();
        if (!mail) return;
        this.mails.push(mail);//update mails in the memeory
        this.newMail(new Mail());//reset the new veiw model
        this.showTab(Tabs.list);//back to the 'list' tab
        this.saveStorage();//update mails in the storage
    };
    //active mail 'edit' tab
    this.edit = (mail) => {
        this.editingMail(mail);
        this.showTab(Tabs.edit);// active the 'edit' tab
    };
    //submit mail update
    this.update = (form) => {
        this.showTab(Tabs.list);//back to the 'list' tab
        this.saveStorage();//update mails in the storage
        this.editingMail(null);//reset the editing view model
    };
    //remove mail
    this.remove = (mail) => {
        this.mails.remove(mail);//remove mails in the memeory
        this.saveStorage();//update mails in the storage
    };
    //open the mail web page
    this.visitWeb = (mail) => {
        var mail = mail.user();
        if (!mail) return;
        var index = mail.lastIndexOf('@');
        if (!~index) return;
        var domain = mail.substring(index + 1).toLowerCase();
        chrome.tabs.create({ url: `https://mail.${domain}` });
    };
    //update mails in the storage
    this.saveStorage = () => {
        
        chrome.storage.local.set({ 'mails': ko.toJS(this.mails()) });
    };
    //export the mail list to the file named 'mail-checker.json'
    this.export = () => {
        var whitelist = ['user', 'password', 'host', 'port', 'tls'];
        var json = ko.toJSON(this.mails, whitelist, 2);
        var file = new File([json], "mail-checker.json", { type: "application/json;charset=utf-8" });
        saveAs(file);
    };
    //update the current mail list
    this.updateMails = mails => {
        mails = Array.isArray(mails) ? mails : [mails];
        mails.forEach(mail => {
            if (!mail || !mail.user) return false;
            var oldItem = this.mails().find(m => m.user() === mail.user);
            var newItem = new Mail(mail);
            if (oldItem) {//replace the current mail if exists
                this.mails.replace(oldItem, newItem);
            } else {//append new mail if not exists
                this.mails.push(newItem);
            }
        });
        this.saveStorage();//save the change to storage
    }
    //import external json file
    this.import = () => {
        var fileSelector = new FileSelector('.json');
        fileSelector.readAsJSON()//read and return json data
            .then(this.updateMails)//save changes
            .then(() => this.showTab(Tabs.list))//active 'list' tab
            .catch(err => {//error handle
                this.settingsError('Invalid json file.');//show error info
                setTimeout(() => this.settingsError(''), 3000);//hide error info after 3 senconds
                console.error(err);
            });
    };
    //active specified tab
    this.showTab = (tab) => {
        $(`#navs a[href="#${tab}"]`).tab('show');
    };
}
//config ko
chrome.storage.local.get('mails', (obj) => {
    var mails = Array.isArray(obj.mails) ? obj.mails : [];
    mails = mails.map(m => new Mail(m));//convert to view model
    var model = new EmailListViewModel();
    model.mails(mails);//set mail list
    ko.applyBindings(model);
    //receive message from background.js to update unseen count or error
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        var oldItem = model.mails().find(m => m.user() === message.user);
        if (!oldItem) return;//ignore invalid and obsolete operation
        oldItem.unseen(message.unseen);//update unseen count
        oldItem.error(message.error);//update error info
    });
});
//custom bindings to show or hide buttons
ko.bindingHandlers.showOperations = {
    init: (ele) => {
        $(ele).hover(() => $(".operations", ele).toggleClass('invisible'));
    }
}