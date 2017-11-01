/**
 * Project arch
 */


import Foundation


/**
 * @brief  LoginViewController class
 * 
 * @author: uml 
 * 
 * @version: 2017年11月1日 15:51:35
 */

public class LoginViewController: AccountHandler , LoginViewDelegate {
    func onSuccess(entity: AccountDataModel) {
        
    }
    
    func bindTarget(control: AnyObject, action: AnyObject, event: AnyObject) {
        
    }
    

    /**
     * @brief login
     * @param sender 
     * @return IBAction
     */
    func login(sender: AnyObject) -> AnyObject {

        return section.init() as AnyObject
    }

    /**
     * @brief register
     * @param sender 
     * @return IBAction
     */
    func register(sender: AnyObject) -> AnyObject {

        return section.init() as AnyObject
    }

}
