/**
 * Project arch
 */


import Foundation


/**
 * @brief  AccountStorage class
 * 
 * @author: uml 
 * 
 * @version: 2017年11月1日 15:51:35
 */

public class AccountStorage {

    /**
     * @brief sharedInstance
     * @return AccountStorage
     */
    static func sharedInstance() -> AccountStorage {

        return AccountStorage.init()
    }

}
