/**
 * Project arch
 */


import Foundation


/**
 * @brief  LoginBiz class
 * 
 * @author: uml 
 * 
 * @version: 2017年11月1日 15:51:35
 */

public class LoginBiz: ModelBiz  {
    var handler: ModelHandler

    init(h:ModelHandler) {
        self.handler = h
    }
    /**
     * @brief requestLogin
     * @param account 
     * @param password
     */
    func requestLogin(account: String, password: String) {

    }

}
