

/**
 * @brief  ModelHandler class
 * 
 * @author: uml 
 * 
 * @version: 2017年11月1日 15:51:35
 */

protocol ModelHandler {

    /**
     * @brief onSuccess
     * @param entity
     */
    func onSuccess(entity: DataModel)

    /**
     * @brief onFailure
     * @param code 
     * @param message
     */
    func onFailure(code: Int, message: String)

    /**
     * @brief onCommond
     * @param sel 
     * @param args
     */
    func onCommond(sel: AnyObject, args: String)
}
